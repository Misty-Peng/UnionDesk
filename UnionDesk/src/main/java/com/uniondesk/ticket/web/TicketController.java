package com.uniondesk.ticket.web;

import com.uniondesk.common.demo.DemoDataService;
import com.uniondesk.common.demo.DemoDtos.CreateTicketRequest;
import com.uniondesk.common.demo.DemoDtos.TicketDetailView;
import com.uniondesk.common.demo.DemoDtos.TicketSummaryView;
import com.uniondesk.common.demo.DemoDtos.UpdateTicketStatusRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tickets")
public class TicketController {

    private final DemoDataService demoDataService;

    public TicketController(DemoDataService demoDataService) {
        this.demoDataService = demoDataService;
    }

    @GetMapping
    public List<TicketSummaryView> list(
            @RequestParam(required = false) Long businessDomainId,
            @RequestParam(required = false) String status) {
        return demoDataService.listTickets(businessDomainId, status);
    }

    @GetMapping("/{ticketNo}")
    public TicketDetailView detail(@PathVariable String ticketNo) {
        return demoDataService.getTicket(ticketNo);
    }

    @GetMapping("/id/{id}")
    public TicketDetailView detailById(@PathVariable long id) {
        return demoDataService.getTicketById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketDetailView create(@Valid @RequestBody CreateTicketRequest request) {
        return demoDataService.createTicket(request);
    }

    @PatchMapping("/{ticketNo}/status")
    public TicketDetailView updateStatus(
            @PathVariable String ticketNo,
            @Valid @RequestBody UpdateTicketStatusRequest request) {
        return demoDataService.updateTicketStatus(ticketNo, request.status());
    }

    @PostMapping("/{id}/processing")
    public Map<String, Object> markProcessing(@PathVariable long id) {
        demoDataService.updateTicketStatusById(id, "processing");
        return Map.of("ok", true, "status", "processing");
    }

    @PostMapping("/{id}/resolved")
    public Map<String, Object> markResolved(@PathVariable long id) {
        demoDataService.updateTicketStatusById(id, "resolved");
        return Map.of("ok", true, "status", "resolved");
    }
}
