import { sendEmail } from "../API/email";
import { useMutation } from "@tanstack/react-query";



export const useSendEmailMessage = (headers ) => {
    return (
        useMutation({
            mutationFn: () =>
                //joinChat(headers, chatId, id),
                sendEmail(headers, chatId, id),
            onSuccess: () => {
                console.log("Joined Chat From mutations");
                //setMemberOfChat(true);
            },
            onError: (error) => {
                console.log("Data Mutationj", error);
            },
        }));
};

