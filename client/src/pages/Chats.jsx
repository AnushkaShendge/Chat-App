import { useContext, useEffect, useRef, useState } from "react";
import { IoSendSharp } from "react-icons/io5";
import { IoChatbubblesSharp } from "react-icons/io5";
import { UserContext } from '../UserContext';
import { ImCross } from "react-icons/im";
import { uniqBy } from 'lodash';
import axios from "axios";
import Contact from "./Conatct";
import { FaUserAlt } from "react-icons/fa";
import { Navigate } from "react-router-dom";
import { MdOutlineAttachFile } from "react-icons/md";

function Chats() {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [selContact, setSelContact] = useState('');
  const { name, id, setId, setName } = useContext(UserContext);
  const [newMessageText, setNewMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const divUnderMessages = useRef();
  const [offline, setOffline] = useState([]);
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4000');
    setWs(ws);
    ws.addEventListener('message', handleMessage);
  }, []);

  function handleMessage(e) {
    const messageData = JSON.parse(e.data);
    if ('online' in messageData) {
      showOnlinePeople(messageData.online);
    } else if ('text' in messageData) {
      setMessages(prev => ([...prev, { ...messageData }]));
    }
  }

  function showOnlinePeople(peopleArray) {
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      if (userId !== id) {
        people[userId] = username;
      }
    });
    setOnlinePeople(people);
  }

  function sendMessage(e, file = null) {
    if (e) {e.preventDefault();}
    console.log(file)

    const message = {
      recipient: selContact,
      text: newMessageText,
      sender: id,
      file: file,
      _id: Date.now(),
    };
    ws.send(JSON.stringify(message));
    if (file) {
        axios.get(`http://localhost:4000/messages/${selContact}`).then(res => {
        setMessages(res.data);
      });
    } else {
      setMessages(prev => ([...prev, {
        text: newMessageText,
        sender: id,
        recipient: selContact,
        _id: Date.now(),
      }]));
      setNewMessageText('');
    }
  }

  function logout() {
    axios.post('http://localhost:4000/logout', {}).then(() => {
      setWs(null);
      setId(null);
      setName(null);
      setRedirect(true);
    });
  }

  if (redirect) {
    return <Navigate to='/' />;
  }

  async function sendFile(e) {
    console.log('sendFile triggered');
    const reader = new FileReader();
    reader.readAsDataURL(e.target.files[0]);
    reader.onload = () => {
      console.log('File read', reader.result);
      sendMessage(null , {
        name: e.target.files[0].name,
        data: reader.result
      });
    };
    reader.onerror = (error) => {
      console.log('Error reading file:', error);
    };
  }

  useEffect(() => {
    if (divUnderMessages.current) {
      divUnderMessages.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (selContact) {
      axios.get(`http://localhost:4000/messages/${selContact}`).then((response) => {
        setMessages(response.data);
      }).catch((err) => {
        console.log(err);
      });
    }
  }, [selContact]);

  useEffect(() => {
    axios.get('http://localhost:4000/people').then((response) => {
      const offlinePeopleArr = response.data
        .filter(p => p._id !== id)
        .filter(p => !Object.keys(onlinePeople).includes(p._id));
      const offlinePeople = {};
      offlinePeopleArr.forEach(p => {
        offlinePeople[p._id] = p;
      });
      setOffline(offlinePeople);
    });
  }, [onlinePeople]);

  const onlinePeopleExcluder = { ...onlinePeople };
  delete onlinePeopleExcluder[id];
  const messWithoutDupes = uniqBy(messages, '_id');

  return (
    <div className="flex h-screen">
      <div className="w-1/3 p-2 h-screen overflow-y-auto flex flex-col">
        <div className="text-blue-500 font-bold gap-2 flex items-center justify-center py-2 mb-4">
          <IoChatbubblesSharp size={24} /> ChatApp
        </div>
        <div className="flex-grow">
          {Object.keys(onlinePeopleExcluder).length > 0 ? (
            Object.keys(onlinePeopleExcluder).map(userId => (
              <Contact key={userId} id={userId} username={onlinePeopleExcluder[userId]} onClick={() => setSelContact(userId)} selected={userId === selContact} online={true} />
            ))
          ) : (
            <div className="text-gray-500 text-center">No one is online</div>
          )}
          {Object.keys(offline).length > 0 ? (
            Object.keys(offline).map(userId => (
              <Contact key={userId} id={userId} username={offline[userId].username} onClick={() => setSelContact(userId)} selected={userId === selContact} online={false} />
            ))
          ) : (
            <div className="text-gray-500 text-center">No one is online</div>
          )}
        </div>
        <div className="p-2 text-center   ">
          <span className="m-2 text-sm text-gray-500 flex gap-2 justify-center border-t p-2"><FaUserAlt size={20}/> {name}</span>
          <button onClick={logout} className="text-sm text-gray-500 bg-blue-100 py-1 px-2 border rounded-sm ">logout</button>
        </div>
      </div>
      {!selContact && (
        <div className="flex items-center justify-center text-2xl font-bold text-gray-400 gap-2 bg-blue-200 w-full">
          <ImCross /> Select a person from the sidebar
        </div>
      )}
      {selContact && (
        <div className="flex flex-col w-2/3">
          <div className="flex-grow p-2 bg-blue-200">
            {messWithoutDupes.length > 0 ? (
              messWithoutDupes.map((message, index) => (
                <div key={index} className={`mb-2 ${message.sender === id ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block p-2 ${message.sender === id ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'} rounded-lg`}>
                    {message.text}
                    {message.file && (
                      <a target="_blank" className="border-b flex items-center gap-1" href={`http://localhost:4000/uploads/${message.file}`}  rel="noopener noreferrer" >
                        <MdOutlineAttachFile size={15} />{message.file}
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center">No messages yet</div>
            )}
            <div ref={divUnderMessages}></div>
          </div>
          <form onSubmit={sendMessage} className="flex gap-2 p-2 bg-blue-200">
            <input type="text" value={newMessageText} onChange={(e) => setNewMessageText(e.target.value)}
              placeholder="Type your message here" className="bg-white border p-2 flex-grow rounded-sm" />
            <label className="bg-blue-50 cursor-pointer p-2 text-gray-600 flex items-center justify-center rounded-sm border border-blue-300">
              <input type="file" className="hidden" onChange={sendFile} />
              <MdOutlineAttachFile />
            </label>
            <button className="bg-blue-500 p-2 text-white rounded-sm" type="submit">
              <IoSendSharp size={24} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Chats;
