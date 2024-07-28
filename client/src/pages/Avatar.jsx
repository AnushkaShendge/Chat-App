function Avatar({userId , username , online}){
    const colors = ['bg-red-300' , 'bg-purple-300' , 'bg-cyan-300' , 'bg-blue-300' , 'bg-orange-300' , 'bg-teal-300']
    const userIdBase10 = parseInt(userId , 16)
    const colorIdx = (userIdBase10 % colors.length)
    const color = colors[colorIdx]
    return(
        <div className={"w-8 h-8 rounded-full flex items-center justify-center " +color}>
            <div className="text-center w-full opacity-70">{username[0]}</div>
            {online && (<div className="absolute w-3 h-3 bg-green-500 mt-8 ml-6 rounded-full border border-white"></div>)}
            {!online && (<div className="absolute w-3 h-3 bg-gray-500 mt-8 ml-6 rounded-full border border-white"></div>)}
        </div>
    )
}
export default Avatar