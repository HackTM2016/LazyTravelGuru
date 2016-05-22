package com.lta.flight.scanner.entity.sky;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Carrier {

	@JsonProperty(value="CarrierId")
	private long CarrierId;
	
	@JsonProperty(value="Name")
	private String Name;

	public long getCarrierId() {
		return CarrierId;
	}

	public void setCarrierId(long carrierId) {
		this.CarrierId = carrierId;
	}

	public String getName() {
		return Name;
	}

	public void setName(String name) {
		this.Name = name;
	}
}
