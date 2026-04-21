package com.uniondesk;

import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@ConfigurationPropertiesScan
public class UnionDeskApplication {

    public static void main(String[] args) {
        SpringApplication.run(UnionDeskApplication.class, args);
    }
}
