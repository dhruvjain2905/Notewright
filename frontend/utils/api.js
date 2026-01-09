export const useApi = () => {

    const makeRequest = async (endpoint, options = {}) => {
        // Set default headers for JSON content, unless body is FormData
        const defaultHeaders = options.body instanceof FormData 
            ? {} 
            : { 'Content-Type': 'application/json' };

        const response = await fetch(`http://localhost:8000/api/${endpoint}`, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            if (response.status === 429) {
                throw new Error("Daily quota exceeded");
            }
            throw new Error(errorData?.detail || "An error occurred");
        }

        return response.json();
    };

    return { makeRequest };
};