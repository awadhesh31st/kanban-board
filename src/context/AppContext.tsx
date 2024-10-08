import React, { createContext, useState, ReactNode, useContext, useEffect } from "react";
import {
  AppContextType,
  GroupingType,
  KeyValueType,
  ResponseDataType,
  TicketType,
  UserDataType,
  UserType,
} from "../types";

const AppContext = createContext<AppContextType | undefined>(undefined);

const processUserData = (users: UserType[]): { [key: string]: UserType } => {
  return users.reduce(
    (acc, user) => {
      acc[user.id] = user;
      return acc;
    },
    {} as { [key: string]: UserType }
  );
};

const processUserKeyValue = (users: UserType[]): KeyValueType => {
  return users.reduce((acc, user) => {
    acc[user.id] = user.name;
    return acc;
  }, {} as KeyValueType);
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [users, setUsers] = useState<UserDataType>({});
  const [groupingType, setGroupingType] = useState<GroupingType>({});
  const [activeGroup, setActiveGroup] = useState<KeyValueType>({});
  const [groupBy, setGroupBy] = useState<string>("status");
  const [sortBy, setSortBy] = useState<string>("priority");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("https://api.quicksell.co/v1/internal/frontend-assignment");
        const result: ResponseDataType = await response.json();

        if (result) {
          const { tickets = [], users = [] } = result;
          setTickets(tickets);

          const userData: UserDataType = processUserData(users);
          const userKeyValue = processUserKeyValue(users);

          setUsers(userData);

          const updatedGrouping: GroupingType = {
            status: {
              Backlog: "Backlog",
              Todo: "Todo",
              "In progress": "In progress",
              Done: "Done",
              Canceled: "Canceled",
            },
            user: userKeyValue,
            priority: {
              0: "No priority",
              1: "Low",
              2: "Medium",
              3: "High",
              4: "Urgent",
            },
          };

          setGroupingType(updatedGrouping);
          setActiveGroup(updatedGrouping.status || {});
        } else {
          console.error("Unexpected API response format:", result);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleGroupByChange = (value: string) => {
    setGroupBy(value);
    setActiveGroup(
      value === "status"
        ? groupingType?.status || {}
        : value === "user"
          ? groupingType.user || {}
          : groupingType.priority || {}
    );
  };

  const handleSortByChange = (value: string) => {
    setSortBy(value);
  };

  return (
    <AppContext.Provider
      value={{
        tickets,
        setTickets,
        users,
        setUsers,
        groupBy,
        setGroupBy: handleGroupByChange,
        sortBy,
        setSortBy: handleSortByChange,
        groupingType,
        setGroupingType,
        activeGroup,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
