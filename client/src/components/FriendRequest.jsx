import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

export default function FriendRequest({ request }) {
  const queryClient = useQueryClient();

  const { mutate: acceptConnectionRequest } = useMutation({
    mutationFn: (requestId) =>
      axiosInstance.put(`/connections/accept/${requestId}`),
    onSuccess: () => {
      toast.success("Connection request accepted");
      queryClient.invalidateQueries({ queryKey: ["connectionRequests"] });
    },
    /*************  ✨ Codeium Command ⭐  *************/
    /******  b823d774-d51b-487f-9e58-41d98a4fa696  *******/
    onError: (error) => {
      toast.error(error.response.data.error);
    },
  });

  const { mutate: rejectConnectionRequest } = useMutation({
    mutationFn: (requestId) =>
      axiosInstance.put(`/connections/reject/${requestId}`),
    onSuccess: () => {
      toast.success("Connection request rejected");
      queryClient.invalidateQueries({ queryKey: ["connectionRequests"] });
    },
    onError: (error) => {
      toast.error(error.response.data.error);
    },
  });

  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between transition-all hover:shadow-md">
      <div className="flex items-center gap-4">
        <Link to={`/profile/${request.sender.username}`}>
          <img
            src={
              request.sender.profilePicture ||
              "https://raw.githubusercontent.com/burakorkmez/linkedin-clone/refs/heads/master/frontend/public/avatar.png"
            }
            alt={request.name}
            className="w-16 h-16 rounded-full object-cover"
          />
        </Link>

        <div>
          <Link
            to={`/profile/${request.sender.username}`}
            className="font-semibold text-lg"
          >
            {request.sender.name}
          </Link>
          <p className="text-gray-600">{request.sender.headline}</p>
        </div>
      </div>

      <div className="space-x-2">
        <button
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
          onClick={() => acceptConnectionRequest(request._id)}
        >
          Accept
        </button>
        <button
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
          onClick={() => rejectConnectionRequest(request._id)}
        >
          Reject
        </button>
      </div>
    </div>
  );
}
