import axios from "axios";
import { createContext, useEffect, useState } from "react";


export const UserContext = createContext({});

function UserContextProvider({children}){
    const [name , setName] = useState(null)
    const [id , setId] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:4000/profile' ).then((response) => {
            if(response.data){
                setName(response.data.username);
                setId(response.data.userId);
            }
        })
    } , [])
    console.log(id);

    
    return (
        <UserContext.Provider value={{name , setName , id , setId}}>
            {children}
        </UserContext.Provider>
    )
}
export default UserContextProvider

