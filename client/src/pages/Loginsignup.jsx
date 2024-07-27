import { useContext, useState } from "react";
import { UserContext } from "../UserContext";
import axios from "axios";
import { Navigate } from 'react-router-dom'


function Loginsignup(){
    const [username , setUsername ] = useState('')
    const [password , setPassword] = useState('')
    const [isLoginOrRegister , setIsLoginOrRegister ] = useState('register')
    const {setName , setId} = useContext(UserContext)
    const [redirect , setRedirect] = useState(false)


    async function handleSumbit(e){
        e.preventDefault()
        const url = isLoginOrRegister === 'register' ? 'register' : 'login' 
        const res = await axios.post(`http://localhost:4000/${url}` , {username , password});
        if(res.data){
            setName(res.data.username)
            setId(res.data.id)
            setRedirect(true)
        }
    }
    if(redirect){
        return <Navigate to='/chats' />
    }
    return(
        <div className="bg-blue-50 h-screen flex items-center">
            <form className="w-64 mx-auto mb-12" onSubmit={handleSumbit}>
                <input type="text" value={username} placeholder="username" onChange={(e) => setUsername(e.target.value)} className="block w-full rounded-sm p-2 mb-2 border" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" className="block w-full rounded-sm p-2 mb-2 border" />
                <button className="bg-blue-500 text-white block w-full rounded-sm p-2">
                    {isLoginOrRegister === 'register' ? 'Register' : 'Login'}
                </button>
                <div className="text-center mt-2">
                    {isLoginOrRegister === 'register' && (
                        <div>
                            Already a member ? 
                            <button onClick={() => setIsLoginOrRegister('login')}>Login here</button>
                        </div>

                    )}
                    {isLoginOrRegister === 'login' && (
                        <div>
                            Don't have an account ? 
                            <button onClick={() => setIsLoginOrRegister('login')}>Register now</button>
                        </div>

                    )}
                </div>
            </form>

        </div>
    )
}


export default Loginsignup;