import Avatar from "./Avatar"

export default function Contact({id , username , onClick , selected , online}){
    return(
        <div key={id} onClick={() => onClick(id)}
              className={"border-b border-gray-100 flex items-center gap-5 cursor-pointer " + (selected ? 'bg-blue-50' : '')}>
              {selected && (
                <div className="w-1 bg-blue-500 h-12 rounded-r-md"></div>
              )}
              <div className="flex items-center gap-5 py-2 px-2">
                <Avatar online={online} username={username} userId={id} />
                <span className="text-gray-700">{username}</span>
              </div>
        </div>
    )
}