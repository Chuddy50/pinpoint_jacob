
class ApiError extends Error {
    /**
     * Error object containing response status, error code, and error message
     */
    constructor(status, { error, message }) {
      super(message);
      this.status = status;
      this.code = error;
    }
  }
  
   const baseUrl = "http://127.0.0.1:8000"; 
  
  /**
   * Processes response from GET/POST Request
   * @param {*} response 
   * @returns JSON response or error if
   */ 
  const handleResponse = async (response) => {
    if (response.ok) {
      return response.status == 204 ? {} : await response.json();
    } 
    else {
      const error = await response.json();
      const err = new Error(error.message);
      err.status = response.status;
      throw err;
    }
  };
  
  /**
   * Asynchronously creates GET request
   * @param {*} url destination of request
   * @param {*} headers 
   * @returns value from handlResponse
   */
  export const get = async (url, headers) => {
    const response = await fetch(baseUrl + url, { headers });
    return await handleResponse(response);
  };
  
   /**
   * Login 
   * @param {*} url destination of request
   * @param {*} headers 
   * @returns value from handlResponse
   */
  export const postLoginForm = async (url, values) => {
    const { password } = values;
    const { username } = values;
  
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    
    const response = await fetch(baseUrl + url, {
      method: "POST",
      body: formData,
    });
    return await handleResponse(response);
  };