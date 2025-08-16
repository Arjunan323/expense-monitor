package com.expensetracker.config;

import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI expenseOpenAPI() {
        return new OpenAPI()
                .info(new Info().title("CutTheSpend API")
                        .description("API documentation for CutTheSpend platform")
                        .version("v1")
                        .contact(new Contact().name("Support").email("support@example.com"))
                        .license(new License().name("Proprietary")))
                .externalDocs(new ExternalDocumentation()
                        .description("Repository")
                        .url("https://github.com/Arjunan323/expense-monitor"));
    }
}
