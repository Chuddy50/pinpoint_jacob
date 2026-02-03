import { sendEmail } from "../API/email";
import { useMutation } from "@tanstack/react-query";



export const useSendEmailMessage = (test ) => {
    return (
        useMutation({
            mutationFn: () =>
                sendEmail(),
            onSuccess: () => {
                console.log("Joined Chat From mutations");
                //setMemberOfChat(true);
            },
            onError: (error) => {
                console.log("Data Mutationj", error);
            },
        }));
};

