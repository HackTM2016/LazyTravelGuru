package com.lta.flight.scanner.entity.sky;

import javax.xml.bind.annotation.XmlElement;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Connection {
	@XmlElement(name = "CarrierIds")
	private int[] CarrierIds;

	@XmlElement(name = "OriginId")
	private int OriginId;

	@XmlElement(name = "DestinationId")
	private int DestinationId;

	public int[] getCarriers() {
		return CarrierIds;
	}

	public void setCarriers(int[] carriers) {
		this.CarrierIds = carriers;
	}

	public int getOrigin() {
		return OriginId;
	}

	public void setOrigin(int origin) {
		this.OriginId = origin;
	}

	public int getDestination() {
		return DestinationId;
	}

	public void setDestination(int destination) {
		this.DestinationId = destination;
	}
}
