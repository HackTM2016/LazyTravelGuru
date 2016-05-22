package com.lta.flight.scanner.boundary;

import java.net.HttpURLConnection;
import java.util.List;

import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.GenericEntity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.lta.flight.scanner.controller.FlightsController;
import com.lta.flight.scanner.entity.Flight;

@Path("/flight")
@Stateless
public class FlightsResource {

	@Inject
	private FlightsController controller;

	/**
	 * Request flights from skyscanner
	 * 
	 * @param origin
	 *            The departure airport code (e.g. TSR, BCN, JFK, anywhere)
	 * @param destination
	 *            The destination airport code (e.g. TSR, BCN, JFK, anywhere)
	 */
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.APPLICATION_JSON)
	@Path("{origin}/{destination}")
	public Response retrieveFlights(@PathParam("origin") final String origin,
			@PathParam("destination") final String destination) {
		controller.gatherFlights(origin, destination);
		return Response.status(HttpURLConnection.HTTP_OK).build();
	}

	@GET
	@Path("all")
	@Produces(MediaType.APPLICATION_JSON)
	public Response allFlights() {
		GenericEntity<List<Flight>> flights = new GenericEntity<List<Flight>>(controller.returnFlights(null)) {
		};
		return Response.status(HttpURLConnection.HTTP_OK).entity(flights).build();
	}

}
