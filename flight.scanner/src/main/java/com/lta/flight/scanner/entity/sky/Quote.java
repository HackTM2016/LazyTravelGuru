package com.lta.flight.scanner.entity.sky;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Quote {
	@JsonProperty(value = "QuoteId")
	private int QuoteId;

	@JsonProperty(value = "MinPrice")
	private int MinPrice;

	@JsonProperty(value = "Direct")
	private String Direct;

	@JsonProperty(value = "OutboundLeg")
	private OutboundLeg OutboundLeg;

	@JsonProperty(value = "InboundLeg")
	private InboundLeg InboundLeg;

	public String getDirect() {
		return Direct;
	}

	public void setDirect(String direct) {
		Direct = direct;
	}

	public int getQuoteId() {
		return QuoteId;
	}

	public void setQuoteId(int QuoteId) {
		this.QuoteId = QuoteId;
	}

	public int getMinPrice() {
		return MinPrice;
	}

	public void setMinPrice(int MinPrice) {
		this.MinPrice = MinPrice;
	}

	public OutboundLeg getOutboundLeg() {
		return OutboundLeg;
	}

	public void setOutboundLeg(OutboundLeg outbound) {
		this.OutboundLeg = outbound;
	}

	public InboundLeg getInboundLeg() {
		return InboundLeg;
	}

	public void setInboundLeg(InboundLeg inbound) {
		this.InboundLeg = inbound;
	}

}
