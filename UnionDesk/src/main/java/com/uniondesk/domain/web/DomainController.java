package com.uniondesk.domain.web;

import com.uniondesk.common.demo.DemoDataService;
import com.uniondesk.common.demo.DemoDtos.BusinessDomainView;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/domains")
public class DomainController {

    private final DemoDataService demoDataService;

    public DomainController(DemoDataService demoDataService) {
        this.demoDataService = demoDataService;
    }

    @GetMapping
    public List<BusinessDomainView> list() {
        return demoDataService.listBusinessDomains();
    }
}
