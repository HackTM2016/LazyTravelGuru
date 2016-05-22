package com.lta.flight.scanner.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import javax.annotation.PostConstruct;
import javax.enterprise.context.Dependent;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.Entity;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lta.flight.scanner.entity.Flight;
import com.lta.flight.scanner.entity.sky.Carrier;
import com.lta.flight.scanner.entity.sky.Place;
import com.lta.flight.scanner.entity.sky.Quote;
import com.lta.flight.scanner.entity.sky.SkyScannerResponse;

@Dependent
public class FlightsController {

	private Client client;
	private final static String API_KEY = "dr449826115653302252873787438688";
	private final static String HEADER_PARAM = "X-Forwarded-For";
	private final String SKY_API = "http://partners.api.skyscanner.net/apiservices/browsequotes/v1.0";
	private final static String ES_ADDRESS = "http://172.16.4.15:9200";

	@PostConstruct
	private void init() {
		client = ClientBuilder.newClient();
	}

	public void gatherFlights(String origin, String destination) {
		// Test data here
		// TODO replace with actual parameters
		String countryCode = "RO";
		String currency = "EUR";
		String locale = "ro-RO";
		String departure = origin.equals("anywhere") ? origin : origin + "-sky";
		String departureDate = "anytime";
		String arrival = destination.equals("anywhere") ? destination : destination + "-sky";
		String returnDate = "anytime";
		WebTarget target = client.target(SKY_API).path(countryCode).path(currency).path(locale).path(departure)
				.path(arrival).path(departureDate).path(returnDate);

		Response response = target.queryParam("apiKey", API_KEY).request(MediaType.APPLICATION_JSON)
				.header(HEADER_PARAM, "86.125.231.209").get();
		String jsonResponse = response.readEntity(String.class);
		ObjectMapper mapper = new ObjectMapper();
		SkyScannerResponse readValue = null;
		try {
			readValue = mapper.readValue(jsonResponse, SkyScannerResponse.class);
		} catch (IOException e) {
			e.printStackTrace();
			return;
		}

		for (Quote q : readValue.getQuotes()) {
			client.target(ES_ADDRESS).path("/skyscanner/Quotes").request(MediaType.APPLICATION_JSON)
					.post(Entity.entity(q, MediaType.APPLICATION_JSON), String.class);
		}

		for (Carrier c : readValue.getCarriers()) {
			client.target(ES_ADDRESS).path("/skyscanner/Carriers/" + c.getCarrierId())
					.request(MediaType.APPLICATION_JSON)
					.post(Entity.entity(c, MediaType.APPLICATION_JSON), String.class);
		}

		for (Place p : readValue.getPlaces()) {
			client.target(ES_ADDRESS).path("/skyscanner/Places/" + p.getPlaceId()).request(MediaType.APPLICATION_JSON)
					.post(Entity.entity(p, MediaType.APPLICATION_JSON), String.class);
		}
	}

	public List<Flight> returnFlights(final String userId) {
		String sorting = "{\"sort\":{\"minPrice\":{\"order\":\"asc\"}}}";
		String response = client.target(ES_ADDRESS).path("/skyscanner/Quotes/_search")
				.request(MediaType.APPLICATION_JSON)
				.post(Entity.entity(sorting, MediaType.APPLICATION_JSON), String.class);
		ObjectMapper mapper = new ObjectMapper();
		List<Quote> quotes = new ArrayList<>();
		List<Flight> flights = new ArrayList<>();
		try {
			JsonNode jsonNode = mapper.readTree(response).get("hits").get("hits");
			jsonNode.forEach((JsonNode n) -> quotes.add(unmarshallQuote(n.get("_source"))));
		} catch (Exception e) {
			e.printStackTrace();
		}
		quotes.forEach((Quote q) -> flights.add(mapToFlight(q)));
		return flights;
	}

	private Flight mapToFlight(Quote q) {
		Flight flight = new Flight();
		flight.setCarrier(resolveCarrier(q));
		flight.setDestination(resolveDestination(q));
		flight.setDeparture(resolveDeparture(q));
		flight.setCurrency("EUR");
		flight.setPrice(q.getMinPrice());
		return flight;
	}
	
	private String resolveCarrier(Quote q) {
		String carrier = null;
		if (q.getOutboundLeg() != null) {
			int carrierId = q.getOutboundLeg().getCarriers()[0];

			String queryResult = client.target(ES_ADDRESS).path("/skyscanner/Carriers/" + carrierId)
					.request(MediaType.APPLICATION_JSON).get(String.class);
			ObjectMapper mapper = new ObjectMapper();

			Carrier response = null;
			try {
				JsonNode jsonNode = mapper.readTree(queryResult).get("_source");
				response = mapper.readValue(jsonNode.toString(), Carrier.class);
			} catch (IOException e) {
				e.printStackTrace();
			}
			carrier = response.getName();
		}
		return carrier;
	}
	
	private String resolveDestination(Quote q) {
		String destination = null;
		if (q.getOutboundLeg() != null) {
			int destId = q.getOutboundLeg().getDestination();

			String queryResult = client.target(ES_ADDRESS).path("/skyscanner/Places/" + destId)
					.request(MediaType.APPLICATION_JSON).get(String.class);
			ObjectMapper mapper = new ObjectMapper();

			Place response = null;
			try {
				JsonNode jsonNode = mapper.readTree(queryResult).get("_source");
				response = mapper.readValue(jsonNode.toString(), Place.class);
			} catch (IOException e) {
				e.printStackTrace();
			}
			destination = response.getName();
		}
		return destination;
	}
	
	private String resolveDeparture(Quote q) {
		String departure = null;
		if (q.getOutboundLeg() != null) {
			int departId = q.getOutboundLeg().getOrigin();

			String queryResult = client.target(ES_ADDRESS).path("/skyscanner/Places/" + departId)
					.request(MediaType.APPLICATION_JSON).get(String.class);
			ObjectMapper mapper = new ObjectMapper();

			Place response = null;
			try {
				JsonNode jsonNode = mapper.readTree(queryResult).get("_source");
				response = mapper.readValue(jsonNode.toString(), Place.class);
			} catch (IOException e) {
				e.printStackTrace();
			}
			departure = response.getName();
		}
		return departure;
	}

	private Quote unmarshallQuote(JsonNode q) {
		ObjectMapper mapper = new ObjectMapper();
		Quote readValue = null;
		try {
			readValue = mapper.readValue(q.toString(), Quote.class);
		} catch (IOException e) {
			e.printStackTrace();
		}
		return readValue;
	}

}
