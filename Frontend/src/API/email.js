
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
Asynchronously creates GET request
 * @param {*} url destination of request
 * @param {*} headers 
 * @returns value from handlResponse
 */
export const get = async (url, headers) => {
  const response = await fetch(baseUrl + url, { headers });
  return await handleResponse(response);
};



export const sendEmail = async () => {
    console.log("sending email --api");

    //  // this is the backend call state 
    //  try {
    //   // 
    //   const res = await fetch("http://127.0.0.1:8000/consultant/chat", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       messages: nextMessages, // this is the context akaa chat history
    //     }),
    //   });


    //   // error handling for backend 
    //   if (!res.ok) {
    //     throw new Error(`Backend error ${res.status}`);
    //   }

    return 1;
}


export const updateAccount = async (url, values, headers) => {
    const sanitizedValues = {
      ...values,
      username: values.username?.trim() === "" ? null : values.username,
      email: values.email?.trim() === "" ? null : values.email,
    };
  
  
    const response = await fetch(baseUrl + url, {
      method: "PUT",
      body: JSON.stringify(sanitizedValues),
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });
  
    return await handleResponse(response);
  };