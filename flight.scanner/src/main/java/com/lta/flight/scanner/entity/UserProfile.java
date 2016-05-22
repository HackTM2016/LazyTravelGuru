package com.lta.flight.scanner.entity;

public class UserProfile {
	
	private String name;
	private String homeTown;
	private String desiredDestination;
	private String gender;
	private String interests;
	private int age;
	private double priceRange;
	private String timeYear; //spring,summer,autumn,winter
	
	
	
	public UserProfile(String name, String homeTown, String desiredDestination, String gender, String interests,
			int age, double priceRange, String timeYear) {
		super();
		this.name = name;
		this.homeTown = homeTown;
		this.desiredDestination = desiredDestination;
		this.gender = gender;
		this.interests = interests;
		this.age = age;
		this.priceRange = priceRange;
		this.timeYear = timeYear;
	}
	
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getHomeTown() {
		return homeTown;
	}
	public void setHomeTown(String homeTown) {
		this.homeTown = homeTown;
	}
	public String getDesiredDestination() {
		return desiredDestination;
	}
	public void setDesiredDestination(String desiredDestination) {
		this.desiredDestination = desiredDestination;
	}
	public String getGender() {
		return gender;
	}
	public void setGender(String gender) {
		this.gender = gender;
	}
	public String getInterests() {
		return interests;
	}
	public void setInterests(String interests) {
		this.interests = interests;
	}
	public int getAge() {
		return age;
	}
	public void setAge(int age) {
		this.age = age;
	}
	public double getPriceRange() {
		return priceRange;
	}
	public void setPriceRange(double priceRange) {
		this.priceRange = priceRange;
	}
	public String getTimeYear() {
		return timeYear;
	}
	public void setTimeYear(String timeYear) {
		this.timeYear = timeYear;
	}
	
	
}
