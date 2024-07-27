import { useContext, useState } from 'react'
import { Route , Routes } from 'react-router-dom'
import Loginsignup from './pages/Loginsignup'
import axios from 'axios'
import { UserContext }  from './UserContext';
import Chats from './pages/Chats';



function App() {
  axios.defaults.baseURL = 'http:localhost:4000';
  axios.defaults.withCredentials = true;

  return ( 
    <Routes>
      <Route path='/' element={<Loginsignup />} />
      <Route path='/chats' element={<Chats />} />
    </Routes>
  )
}

export default App
