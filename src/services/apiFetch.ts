/**
 * Fetch data from a provided API endpoint URL.
 * @param github_url The API endpoint URL to fetch data from.
 * @returns The response data as text.
 */
export async function getGithubFileCode(github_url: string) {
    try {
        // Example: https://github.com/{username}/{repo}/blob/{branch}/{path/to/file}
        const match = github_url.match(
            /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/[^\/]+\/(.+)$/
        );
        if (!match) {
            throw new Error('Invalid GitHub file URL format.');
        }
        const username = match[1];
        const repo_name = match[2];
        const path = match[3];

        const apiUrl = `https://api.github.com/repos/${username}/${repo_name}/contents/${path}`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.content) {
            throw new Error('No content found in the API response.');
        }
        // Decode base64 content
        const decodedContent = Buffer.from(data.content, 'base64').toString('utf-8');
        return decodedContent;
    } catch (error) {
        console.error('Error fetching GitHub file content:', error);
        throw error;
    }
}

/**
 * Make a flexible API request (GET, POST, etc.) with support for custom headers, JSON body, and optional bearer auth.
 * Only supports JSON responses.
 * @param params The request parameters: url, method, headers, body, auth
 * @returns The response data as a stringified JSON.
 */
export async function flexibleApiRequest(params: {
    url: string,
    method?: string,
    headers?: Record<string, string>,
    body?: object,
    auth?: { bearer?: string }
}): Promise<string> {
    try {
        const { url, method = "GET", headers = {}, body, auth } = params;
        const fetchHeaders: Record<string, string> = { ...headers };

        if (auth && auth.bearer) {
            fetchHeaders["Authorization"] = `Bearer ${auth.bearer}`;
        }

        if (body) {
            fetchHeaders["Content-Type"] = "application/json";
        }

        const fetchOptions: RequestInit = {
            method,
            headers: fetchHeaders,
        };

        if (body) {
            fetchOptions.body = JSON.stringify(body);
        }

        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
            throw new Error("Response is not JSON");
        }

        const data = await response.json();
        return JSON.stringify(data, null, 2);
    } catch (error) {
        console.error('Error in flexibleApiRequest:', error);
        throw error;
    }
}