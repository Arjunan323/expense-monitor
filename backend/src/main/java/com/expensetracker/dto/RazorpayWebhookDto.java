package com.expensetracker.dto;

public class RazorpayWebhookDto {
    private String event;
    private Payload payload;

    public static class Payload {
        public Payment payment;
        public Order order;
    }
    public static class Payment {
        public String id;
        public String status;
        public String order_id;
        public String email;
    }
    public static class Order {
        public String id;
        public int amount;
        public String status;
    }

    public String getEvent() { return event; }
    public void setEvent(String event) { this.event = event; }
    public Payload getPayload() { return payload; }
    public void setPayload(Payload payload) { this.payload = payload; }
}
