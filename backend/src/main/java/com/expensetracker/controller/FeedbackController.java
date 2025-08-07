package com.expensetracker.controller;

import com.expensetracker.dto.FeedbackDto;
import com.expensetracker.model.Feedback;
import com.expensetracker.repository.FeedbackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/feedback")
public class FeedbackController {
    @Autowired
    private FeedbackRepository feedbackRepository;

    @PostMapping
    public String submitFeedback(@RequestBody FeedbackDto feedbackDto) {
        Feedback feedback = new Feedback();
        feedback.setEmail(feedbackDto.getEmail());
        feedback.setMessage(feedbackDto.getMessage());
        feedback.setCreatedAt(LocalDateTime.now());
        feedbackRepository.save(feedback);
        return "Feedback submitted successfully";
    }
}
