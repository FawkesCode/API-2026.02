interface UserMessagesProps {
  sector: string;
  team: string;
  date: Date;
  title: string;
  description: string;
  userName: string;
}

export default function UserMessages({
  sector,
  team,
  date,
  title,
  description,
  userName,
}: UserMessagesProps) {
  return (
    <div className="flex flex-col border-gray-200 border-2 bg-gray-100 p-5 rounded-xl w-1/2 h-1/3 overflow-hidden">
      <div className="flex items-center justify-center px-1 bg-indigo-400 rounded-2xl border-indigo-600 border-2 mb-5 w-1/2 opacity-80">
        <p className=" text-white font-semibold"> {team} | {sector}</p>
      </div>
      <div className="flex flex-col px-1 rounded-xl">
        <h2 className="text-xl">{title} | {userName}</h2>
        <p className="text-base mt-3 text-gray-500">
          {description}
        </p>
      </div>
      <div className="flex justify-end items-center mt-2">
        <span className="text-sm text-gray-500">Enviada Em <span className="italic">{date.toLocaleString()}</span></span>
      </div>
    </div>
  );
}
