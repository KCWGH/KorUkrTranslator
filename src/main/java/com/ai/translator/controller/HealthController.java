package com.ai.translator.controller;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.MemoryUsage;
import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/ping")
    public String ping() {
        return "OK";
    }

    @GetMapping("/health/memory")
    public Map<String, Object> getMemoryInfo() {
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        MemoryUsage heapMemory = memoryBean.getHeapMemoryUsage();
        MemoryUsage nonHeapMemory = memoryBean.getNonHeapMemoryUsage();
        
        Map<String, Object> memoryInfo = new HashMap<>();
        
        // 힙 메모리 정보
        Map<String, Object> heapInfo = new HashMap<>();
        heapInfo.put("used", heapMemory.getUsed());
        heapInfo.put("max", heapMemory.getMax());
        heapInfo.put("committed", heapMemory.getCommitted());
        heapInfo.put("usagePercent", (double) heapMemory.getUsed() / heapMemory.getMax() * 100);
        memoryInfo.put("heap", heapInfo);
        
        // 논힙 메모리 정보
        Map<String, Object> nonHeapInfo = new HashMap<>();
        nonHeapInfo.put("used", nonHeapMemory.getUsed());
        nonHeapInfo.put("max", nonHeapMemory.getMax());
        nonHeapInfo.put("committed", nonHeapMemory.getCommitted());
        memoryInfo.put("nonHeap", nonHeapInfo);
        
        // 가비지 컬렉션 정보
        Map<String, Object> gcInfo = new HashMap<>();
        ManagementFactory.getGarbageCollectorMXBeans().forEach(gc -> {
            Map<String, Object> gcDetails = new HashMap<>();
            gcDetails.put("name", gc.getName());
            gcDetails.put("collectionCount", gc.getCollectionCount());
            gcDetails.put("collectionTime", gc.getCollectionTime());
            gcInfo.put(gc.getName(), gcDetails);
        });
        memoryInfo.put("garbageCollectors", gcInfo);
        
        return memoryInfo;
    }
}
