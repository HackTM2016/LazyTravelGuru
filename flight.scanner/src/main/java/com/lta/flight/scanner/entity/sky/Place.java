package com.lta.flight.scanner.entity.sky;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Place {

	@JsonProperty(value = "PlaceId")
	private long PlaceId;

	@JsonProperty(value = "IataCode")
	private String IataCode;

	@JsonProperty(value = "Name")
	private String Name;

	@JsonProperty(value = "SkyscannerCode")
	private String SkyscannerCode;

	public long getPlaceId() {
		return PlaceId;
	}

	public void setPlaceId(long placeId) {
		this.PlaceId = placeId;
	}

	public String getIataCode() {
		return IataCode;
	}

	public void setIataCode(String iataCode) {
		this.IataCode = iataCode;
	}

	public String getName() {
		return Name;
	}

	public void setName(String name) {
		this.Name = name;
	}

	public String getSkyscannerCode() {
		return SkyscannerCode;
	}

	public void setSkyscannerCode(String skyscannerCode) {
		this.SkyscannerCode = skyscannerCode;
	}
}
