package com.pet.project.airline.gateway.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;

import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Wraps a request to add extra headers (used to forward the authenticated username and
 * roles downstream to the microservices).
 */
class HeaderAddingRequestWrapper extends HttpServletRequestWrapper {

    private final Map<String, String> extraHeaders = new HashMap<>();

    HeaderAddingRequestWrapper(HttpServletRequest request, String name, String value) {
        super(request);
        if (value != null) {
            extraHeaders.put(name.toLowerCase(), value);
        }
    }

    HeaderAddingRequestWrapper(HttpServletRequest request, Map<String, String> headers) {
        super(request);
        headers.forEach((name, value) -> {
            if (value != null) {
                extraHeaders.put(name.toLowerCase(), value);
            }
        });
    }

    @Override
    public String getHeader(String name) {
        String extra = extraHeaders.get(name.toLowerCase());
        return extra != null ? extra : super.getHeader(name);
    }

    @Override
    public Enumeration<String> getHeaders(String name) {
        String extra = extraHeaders.get(name.toLowerCase());
        if (extra != null) {
            return Collections.enumeration(List.of(extra));
        }
        return super.getHeaders(name);
    }

    @Override
    public Enumeration<String> getHeaderNames() {
        List<String> names = Collections.list(super.getHeaderNames());
        names.addAll(extraHeaders.keySet());
        return Collections.enumeration(names);
    }
}
