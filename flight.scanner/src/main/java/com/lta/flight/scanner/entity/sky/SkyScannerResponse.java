package com.lta.flight.scanner.entity.sky;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class SkyScannerResponse {

	@JsonProperty(value="Quotes")
	private Quote[] quotes;

	@JsonProperty(value="Carriers") 
	private Carrier[] carriers;
	
	@JsonProperty(value="Places")
	private Place[] places;
	
	public Quote[] getQuotes() {
		return quotes;
	}
	
	public Carrier[] getCarriers() {
		return carriers;
	}

	public void setCarriers(Carrier[] carriers) {
		this.carriers = carriers;
	}

	public Place[] getPlaces() {
		return places;
	}

	public void setPlaces(Place[] places) {
		this.places = places;
	}

	public void setQuotes(Quote[] quotes) {
		this.quotes = quotes;
	}
}
