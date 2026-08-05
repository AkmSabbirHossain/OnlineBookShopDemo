// ১. র-অ্যাক্সিওস বাদ দিয়ে আপনার কাস্টম অ্যাক্সিওস ইন্সট্যান্সটি ইমপোর্ট করুন
// (আপনার প্রজেক্টের ফোল্ডার স্ট্রাকচার অনুযায়ী পাথটি মিলিয়ে নেবেন, সাধারণত '../services/axiosInstance' বা '../../utils/axiosInstance' এমন হয়)
import axiosInstance from './axiosInstance';
import type { StockHistoryResponseDto } from '../types/stockhistory.types';

// আপনি যেহেতু Vite-এর প্রক্সি ব্যবহার করছেন, তাই শুধু রিলেটিভ পাথ দিলেই হবে
const API_BASE_URL = '/StockHistory';

export const StockHistoryService = {

    getByBookId: async (bookId: number): Promise<StockHistoryResponseDto[]> => {
      
        const response = await axiosInstance.get<StockHistoryResponseDto[]>(`${API_BASE_URL}/book/${bookId}`);
        return response.data;
    },

    getRecentChanges: async (count: number = 50): Promise<StockHistoryResponseDto[]> => {
     
        const response = await axiosInstance.get<StockHistoryResponseDto[]>(`${API_BASE_URL}/recent`, {
            params: { count }
        });
        return response.data;
    },

    hasHistory: async (bookId: number): Promise<{ bookId: number; hasHistory: boolean }> => {
   
        const response = await axiosInstance.get<{ bookId: number; hasHistory: boolean }>(`${API_BASE_URL}/check/${bookId}`);
        return response.data;
    }
};