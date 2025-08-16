package com.expensetracker.controller;

import com.expensetracker.dto.FeedbackDto;
import com.expensetracker.model.Feedback;
import com.expensetracker.repository.FeedbackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/feedback")
@io.swagger.v3.oas.annotations.tags.Tag(name = "Feedback", description = "Collect user feedback & analytics feedback")
public class FeedbackController {
    @Autowired
    private FeedbackRepository feedbackRepository;

    @PostMapping
    @io.swagger.v3.oas.annotations.Operation(summary = "Submit general feedback")
    public String submitFeedback(@RequestBody FeedbackDto feedbackDto) {
        Feedback feedback = new Feedback();
        feedback.setEmail(feedbackDto.getEmail());
        feedback.setMessage(feedbackDto.getMessage());
        feedback.setType(feedbackDto.getType() != null ? feedbackDto.getType() : "GENERAL");
        feedback.setMeta(feedbackDto.getMeta());
        feedback.setCreatedAt(LocalDateTime.now());
        feedbackRepository.save(feedback);
        return "Feedback submitted successfully";
    }

    @PostMapping("/analytics")
    @io.swagger.v3.oas.annotations.Operation(summary = "Submit analytics-specific feedback")
    public String submitAnalyticsFeedback(@RequestBody FeedbackDto feedbackDto) {
        if (feedbackDto.getMeta() == null) {
            // meta should capture selected feature flags
            feedbackDto.setMeta("{}");
        }
        feedbackDto.setType("ANALYTICS");
        return submitFeedback(feedbackDto);
    }
}
