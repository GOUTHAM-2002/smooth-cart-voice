import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini with Vite environment variable
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

// Define available functions for Gemini
// Add these imports
import { useFilters, FilterState } from "@/context/FilterContext";
import { filterOptions } from "@/data/products";

// Add this to the availableFunctions object
const availableFunctions = {
  showGymClothes: {
    name: "showGymClothes",
    description:
      "Execute this function if the user is interested in gym clothes or any related activities or equipment associated with the gym only.",
    parameters: {},
  },
  showYogaEquipment: {
    name: "showYogaEquipment",
    description:
      "Execute this function if the user is interested in any yoga activities or asks about yoga in general.",
    parameters: {},
  },
  goToCart: {
    name: "goToCart",
    description: "Navigate to shopping cart",
    parameters: {},
  },
  checkout: {
    name: "checkout",
    description: "Start checkout process",
    parameters: {},
  },
  showRunningGear: {
    name: "showRunningGear",
    description:
      "Execute this function if the user is interested in running, jogging, or any running-related activities or equipment",
    parameters: {},
  },
  applyFilters: {
    name: "applyFilters",
    description:
      "Apply filters to the product listing page, such as colors, sizes, price ranges, brands, etc.",
    parameters: {},
  },
  clearFilters: {
    name: "clearFilters",
    description: "Clear all applied filters on the product listing page",
    parameters: {},
  },
};

export const VoiceListener = () => {
  // Add this near the top of the component
  const { updateFilters, clearFilters } = useFilters();

  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    if ("webkitSpeechRecognition" in window && !isListening) {
      recognitionRef.current = new (window as any).webkitSpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        console.log("Voice recognition activated");
      };

      recognitionRef.current.onresult = async (event: any) => {
        // Temporarily stop listening while processing
        recognitionRef.current.stop();

        const results = Array.from(event.results);
        for (let result of results) {
          const transcript = result[0].transcript.toLowerCase();
          setTranscript(transcript);
          console.log("Processing command:", transcript);

          // Handle voice commands
          await handleVoiceCommand(transcript);
        }

        // Resume listening after processing
        startListening();
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Error occurred in recognition:", event.error);

        if (event.error !== "aborted") {
          setIsListening(false);
          recognitionRef.current = null;
          // Restart listening after error
          setTimeout(startListening, 1000);
        }
      };

      recognitionRef.current.onend = () => {
        // Only restart if we're not actively processing a command
        if (isListening) {
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.error("Restart failed:", error);
            setIsListening(false);
            recognitionRef.current = null;
            setTimeout(startListening, 300);
          }
        }
      };

      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Failed to start recognition:", error);
        setIsListening(false);
        recognitionRef.current = null;
      }
    }
  };

  // Update the interpretCommand function to better detect clearFilters intent
  const interpretCommand = async (transcript: string) => {
    try {
      // First, directly check for clear filter phrases
      const clearFilterPhrases = [
        "clear filter", 
        "reset filter", 
        "remove filter", 
        "clear all filter", 
        "reset all filter",
        "remove all filter",
        "clear the filter",
        "start over"
      ];
      
      // Check if the transcript contains any clear filter phrases
      for (const phrase of clearFilterPhrases) {
        if (transcript.includes(phrase)) {
          console.log("Direct match for clear filters detected");
          return "clearFilters";
        }
      }
      
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
      const prompt = `
        You are a shopping assistant that helps users navigate an e-commerce website.
        Analyze the following voice command and determine which function to call.
        
        User command: "${transcript}"
  
        Available functions:
        ${Object.values(availableFunctions)
          .map((fn) => `- ${fn.name}: ${fn.description}`)
          .join("\n")}
  
        Return ONLY the function name that best matches the user's intent, or "unknown" if no function matches.
        IMPORTANT: If the user is asking to clear, reset, or remove filters in ANY way, you MUST return "clearFilters".
        Do not include any other text in your response.
      `;
  
      const result = await model.generateContent(prompt);
      const response = await result.response.text().trim();
      return response;
    } catch (error) {
      console.error("Gemini API error:", error);
      return "unknown";
    }
  };

  // Create a dedicated function for clearing filters
  const handleClearFilters = async (transcript: string) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `
        You are a shopping assistant that helps users with filtering products.
        Analyze this voice command and determine if the user wants to clear or reset all filters.
        
        User command: "${transcript}"
        
        Return ONLY "yes" if the user wants to clear/reset filters, or "no" if not.
        Examples of clear filter commands: "clear filters", "reset filters", "remove all filters", "start over with filters", etc.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response.text().trim().toLowerCase();
      
      if (response === "yes") {
        clearFilters();
        console.log("All filters cleared via dedicated function");
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Clear filters detection error:", error);
      return false;
    }
  };

  // Update the handleVoiceCommand function to prioritize clear filters detection
  const handleVoiceCommand = async (command: string) => {
    console.log("Processing command:", command);
    
    // First check if this is a clear filters command using the dedicated function
    const isFilterCleared = await handleClearFilters(command);
    if (isFilterCleared) {
      return;
    }
    
    // Then check for filter updates
    const filterResult = await interpretFilterCommand(command);
    if (filterResult === "filters_updated") {
      console.log("Filters updated via voice");
      return;
    }
    
    // Finally, handle navigation and other commands
    const action = await interpretCommand(command);
    console.log("Interpreted action:", action);
    
    switch (action) {
      case "showGymClothes":
        await navigate("/products/gym");
        break;
      case "showYogaEquipment":
        await navigate("/products/yoga");
        break;
      case "goToCart":
        await navigate("/cart");
        break;
      case "checkout":
        await navigate("/payment");
        break;
      case "showRunningGear":
        await navigate("/products/jogging");
        break;
      case "applyFilters":
        // Already handled by interpretFilterCommand
        break;
      case "clearFilters":
        // Call the clearFilters function from context
        clearFilters();
        console.log("All filters cleared via action handler");
        break;
      default:
        console.log("Unknown command:", command);
    }
  };

  const interpretFilterCommand = async (transcript: string) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Create reference maps for exact casing
      const colorMap = Object.fromEntries(
        filterOptions.colors.map(c => [c.toLowerCase(), c])
      );
      const sizeMap = Object.fromEntries(
        filterOptions.sizes.map(s => [s.toLowerCase(), s])
      );
      const materialMap = Object.fromEntries(
        filterOptions.materials.map(m => [m.toLowerCase(), m])
      );
      const genderMap = Object.fromEntries(
        filterOptions.genders.map(g => [g.toLowerCase(), g])
      );
      const brandMap = Object.fromEntries(
        filterOptions.brands.map(b => [b.toLowerCase(), b])
      );
      const categoryMap = Object.fromEntries(
        filterOptions.subCategories.map(c => [c.toLowerCase(), c])
      );

      const prompt = `
        You are a shopping assistant that helps users filter products.
        Analyze this voice command and determine the filters to apply.
        Command: "${transcript}"

        Available filters:
        - Colors: ${filterOptions.colors.join(", ")}
        - Sizes: ${filterOptions.sizes.join(", ")}
        - Materials: ${filterOptions.materials.join(", ")}
        - Genders: ${filterOptions.genders.join(", ")}
        - Brands: ${filterOptions.brands.join(", ")}
        - Categories: ${filterOptions.subCategories.join(", ")}
        - Price Range: Any range between 0-200 dollars

        Return a JSON object with ONLY the filters mentioned in the command.
        IMPORTANT: Use EXACTLY these keys in your response:
        {
          "colors": [],
          "sizes": [],
          "materials": [],
          "genders": [],
          "brands": [],
          "subCategories": [],
          "price": [min, max]
        }
        
        Only include filters that were explicitly mentioned. Use empty arrays for filter types not mentioned.
        For price, use the format [min, max] with values between 0-200.
        If no specific filters were detected, return an empty object {}.
        
        Make sure all filter values exactly match the available options provided above.
        Return all values in lowercase for consistency.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response.text();
      const cleanedResponse = response
        .replace("```json", "")
        .replace("```", "");
      console.log(cleanedResponse);

      try {
        const parsedFilters = JSON.parse(cleanedResponse.trim());
        console.log("Detected filters:", parsedFilters);

        // Normalize filter keys to ensure consistency and preserve original casing
        const normalizedFilters: Partial<FilterState> = {};
        
        // Process each filter type with proper key names and restore original casing
        if (parsedFilters.colors) {
          normalizedFilters.colors = parsedFilters.colors.map((c: string) => 
            colorMap[c.toLowerCase()] || c
          );
        }
        
        if (parsedFilters.sizes) {
          normalizedFilters.sizes = parsedFilters.sizes.map((s: string) => 
            sizeMap[s.toLowerCase()] || s
          );
        }
        
        if (parsedFilters.materials) {
          normalizedFilters.materials = parsedFilters.materials.map((m: string) => 
            materialMap[m.toLowerCase()] || m
          );
        }
        
        if (parsedFilters.genders) {
          normalizedFilters.genders = parsedFilters.genders.map((g: string) => 
            genderMap[g.toLowerCase()] || g
          );
        }
        
        if (parsedFilters.brands) {
          normalizedFilters.brands = parsedFilters.brands.map((b: string) => 
            brandMap[b.toLowerCase()] || b
          );
        }
        
        if (parsedFilters.subCategories) {
          normalizedFilters.subCategories = parsedFilters.subCategories.map((c: string) => 
            categoryMap[c.toLowerCase()] || c
          );
        }
        
        if (parsedFilters.price) {
          normalizedFilters.price = parsedFilters.price;
        }
        
        if (Object.keys(normalizedFilters).length > 0) {
          // This will add to existing filters rather than replace them
          updateFilters(normalizedFilters);
          return "filters_updated";
        }
      } catch (error) {
        console.error("Error parsing filter JSON:", error);
      }

      return "unknown";
    } catch (error) {
      console.error("Filter interpretation error:", error);
      return "unknown";
    }
  };

  useEffect(() => {
    startListening();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  return null;
};
