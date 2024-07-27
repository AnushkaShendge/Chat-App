import { useContext, useEffect, useRef, useState } from "react";
import { IoSendSharp } from "react-icons/io5";
import { IoChatbubblesSharp } from "react-icons/io5";
import Avatar from "./Avatar";
import { UserContext } from '../UserContext';
import { ImCross } from "react-icons/im";
import { uniqBy } from 'lodash';
import axios from "axios";

function Chats() {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [selContact, setSelContact] = useState('');
  const { id } = useContext(UserContext);
  const [newMessageText, setNewMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const divUnderMessages = useRef()

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4000');
    setWs(ws);
    
    ws.addEventListener('message', handleMessage);


    
  }, []);

  function handleMessage(e) {
    const messageData = JSON.parse(e.data);
    if ('online' in messageData) {
      showOnlinePeople(messageData.online);
    } else if('text' in messageData) {
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

  function sendMessage(e) {
    e.preventDefault();
    if (newMessageText.trim() === '' || !ws || ws.readyState !== WebSocket.OPEN) return;

    const message = {
      recipient: selContact,
      text: newMessageText,
      sender: id,
      id: Date.now(),
    };
    ws.send(JSON.stringify(message));
    setMessages(prev => ([...prev, message]));
    setNewMessageText('');
  }
  useEffect(() => {
    if (divUnderMessages.current) {
      divUnderMessages.current.scrollIntoView({ behavior: 'smooth' });
    }
  } , [messages])
   
  useEffect(() => {
    if(selContact){
        axios.get(`http://localhost:4000/messages/${selContact}`).then((response) =>{
            const messagesData = response.data.map((message) => ({
                sender: message.sender,
                text: message.text,
              }));
              setMessages(messagesData);
        }).catch((err) => {
            console.log(err)
        })
    }


  } , [selContact])

  const onlinePeopleExcluder = { ...onlinePeople };
  delete onlinePeopleExcluder[id];
  const messWithoutDupes = uniqBy(messages, 'id');

  return (
    <div className="flex h-screen">
      <div className="w-1/3 p-2 bg-sky-100">
        <div className="text-blue-500 font-bold gap-2 flex items-center justify-center py-2 mb-4">
          <IoChatbubblesSharp size={24} /> ChatApp
        </div>
        {Object.keys(onlinePeopleExcluder).length > 0 ? (
          Object.keys(onlinePeopleExcluder).map(userId => (
            <div key={userId} onClick={() => setSelContact(userId)}
              className={"border-b border-gray-100 flex items-center gap-5 cursor-pointer " + (userId === selContact ? 'bg-blue-50' : '')}>
              {userId === selContact && (
                <div className="w-1 bg-blue-500 h-12 rounded-r-md"></div>
              )}
              <div className="flex items-center gap-5 py-2 px-2">
                <Avatar username={onlinePeople[userId]} userId={userId} />
                <span className="text-gray-700">{onlinePeople[userId]}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-500 text-center">No one is online</div>
        )}
      </div>
      {!selContact && (
        <div className="flex items-center justify-center text-2xl font-bold text-gray-300 gap-2 mx-auto">
          <ImCross /> Select a person from the sidebar
        </div>
      )}
      {selContact && (
        <div className="flex flex-col w-2/3">
          <div className="flex-grow p-2 overflow-y-scroll bg-blue-200">
            {messWithoutDupes.length > 0 ? (
              messWithoutDupes.map((message, index) => (
                <div key={index} className={`mb-2 ${message.sender === id ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block p-2 ${message.sender === id ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'} rounded-lg`}>
                    {message.sender === id ? 'ME: ' : ''}{message.text}
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
