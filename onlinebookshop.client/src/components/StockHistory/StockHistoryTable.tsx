import React, { useEffect, useState } from 'react';
import { StockHistoryService } from '../../services/stockhistory.service.ts';
import type { StockHistoryResponseDto } from '../../types/stockhistory.types.ts';

interface StockHistoryTableProps {
    bookId?: number;
}

interface AxiosErrorResponse {
    response?: {
        status?: number;
        data?: {
            message?: string;
        };
    };
}

export const StockHistoryTable: React.FC<StockHistoryTableProps> = ({ bookId }) => {
    const [histories, setHistories] = useState<StockHistoryResponseDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchHistory = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch data based on bookId availability
                const data = bookId
                    ? await StockHistoryService.getByBookId(bookId)
                    : await StockHistoryService.getRecentChanges(50);

                if (isMounted) {
                  
                    setHistories(data || []);
                }
            } catch (err: unknown) {
                if (isMounted) {
                    const axiosError = err as AxiosErrorResponse;

                 
                    if (axiosError.response?.status === 404) {
                        setHistories([]);
                    } else {
                        setError(axiosError.response?.data?.message || 'Failed to load stock history');
                    }
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchHistory();

        return () => {
            isMounted = false;
        };
    }, [bookId]);

    if (loading) {
        return (
            <div className="text-center p-5 text-secondary">
                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                Loading stock history...
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger m-3 d-flex align-items-center gap-2" role="alert">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <div>{error}</div>
            </div>
        );
    }

  
    if (histories.length === 0) {
        return (
            <div className="text-center p-5 border rounded-4 bg-white shadow-sm">
                <i className="bi bi-journals fs-1 text-muted d-block mb-2"></i>
                <h5 className="text-dark fw-semibold mb-1">No Stock Logs Found</h5>
                <p className="text-muted small mb-0">
                    {bookId ? "The stock for this book has not been changed yet." : "There is no stock change history recorded in the system yet."}
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto shadow-sm rounded-4 border">
            <table className="table table-hover align-middle mb-0 bg-white text-sm">
                <thead className="table-light text-secondary text-uppercase small">
                    <tr>
                        {!bookId && <th scope="col" className="px-4 py-3">Book Title</th>}
                        <th scope="col" className="px-4 py-3">Changed By</th>
                        <th scope="col" className="px-4 py-3 text-center">Old Stock</th>
                        <th scope="col" className="px-4 py-3 text-center">New Stock</th>
                        <th scope="col" className="px-4 py-3">Reason</th>
                        <th scope="col" className="px-4 py-3">Date & Time</th>
                    </tr>
                </thead>
                <tbody>
                    {histories.map((history) => (
                        <tr key={history.stockHistoryId}>
                            {!bookId && (
                                <td className="px-4 py-3 font-semibold text-dark">
                                    {history.bookTitle || `Book ID: ${history.bookId}`}
                                </td>
                            )}
                            <td className="px-4 py-3 text-muted">{history.changedBy}</td>
                            <td className="px-4 py-3 text-center text-secondary">{history.oldStock}</td>
                            <td className="px-4 py-3 text-center fw-bold text-dark">{history.newStock}</td>
                            <td className="px-4 py-3">
                                <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 rounded-pill small">
                                    {history.reason}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-muted small">
                                {new Date(history.changedAt).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};