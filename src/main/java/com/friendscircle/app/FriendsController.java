package com.friendscircle.app;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FriendsController {
    @GetMapping("/api/friends")
    public List<FriendPayment> friends() {
        return List.of(
                new FriendPayment("Harijan", "Commercial Bank", "commercial", "harijan qr com bank.jpeg"),
                new FriendPayment("Sanjaiyan", "Bank of Ceylon", "boc", "sanjaiyan qr boc.jpeg"),
                new FriendPayment("Sathu", "Bank of Ceylon", "boc", "sathu qr boc.jpeg"),
                new FriendPayment("Sangaman", "Bank of Ceylon", "boc", "sangaman qr boc.jpeg"),
                new FriendPayment("Saeyon", "Dialog Finance", "other", "saeyon qr dilog finance.jpeg"),
                new FriendPayment("Saeyon", "Bank of Ceylon", "other", "saeyon qr.jpeg"),
                new FriendPayment("Sathu", "Commercial Bank", "commercial", "sathu qr com.jpeg"));
    }

    public record FriendPayment(String name, String bank, String group, String file) {
    }
}
