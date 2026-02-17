import { LightningElement, track } from 'lwc';
import initPaginationCursor from '@salesforce/apex/TFB_PaginationCursorController.initPaginationCursor';
import getPage from '@salesforce/apex/TFB_PaginationCursorController.getPage';

const PAGE_SIZE = 10;

const COLUMNS = [
    { label: 'Account Name', fieldName: 'Name', type: 'text', sortable: false },
    { label: 'Industry', fieldName: 'Industry', type: 'text', sortable: false },
    { label: 'Phone', fieldName: 'Phone', type: 'phone', sortable: false },
    {
        label: 'Created Date',
        fieldName: 'CreatedDate',
        type: 'date',
        sortable: false,
        typeAttributes: {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }
    }
];

export default class TfbPaginationCursorDemo extends LightningElement {
    columns = COLUMNS;
    @track records = [];
    paginationCursor;
    currentPage = 0;
    totalRecords = 0;
    nextIndex = 0;
    deletedRowsSkipped = 0;
    hasMorePages = false;
    isLoading = true;
    errorMessage;

    /**
     * Tracks the start index for each page visited via sequential navigation.
     * When navigating forward, getNextIndex() provides the exact start for the next page.
     * For unvisited pages (e.g. after jumping to Last), we fall back to offset-based
     * calculation: (page - 1) * PAGE_SIZE, which fetchPage handles correctly.
     */
    @track pageStartIndices = [0];

    connectedCallback() {
        this.loadInitialData();
    }

    async loadInitialData() {
        this.isLoading = true;
        this.errorMessage = undefined;
        try {
            const result = await initPaginationCursor();
            this.paginationCursor = result.paginationCursor;
            this.records = result.records;
            this.currentPage = result.currentPage;
            this.totalRecords = result.totalRecords;
            this.nextIndex = result.nextIndex;
            this.deletedRowsSkipped = result.deletedRows;
            this.hasMorePages = result.hasMorePages;
            this.pageStartIndices = [0];
        } catch (error) {
            this.errorMessage = this.reduceError(error);
        } finally {
            this.isLoading = false;
        }
    }

    async fetchPageByIndex(startIndex, targetPage) {
        this.isLoading = true;
        this.errorMessage = undefined;
        try {
            const result = await getPage({
                pagCursor: this.paginationCursor,
                startIndex: startIndex,
                pageSize: PAGE_SIZE,
                page: targetPage
            });
            this.paginationCursor = result.paginationCursor;
            this.records = result.records;
            this.currentPage = result.currentPage;
            this.nextIndex = result.nextIndex;
            this.deletedRowsSkipped = result.deletedRows;
            this.hasMorePages = result.hasMorePages;
        } catch (error) {
            this.errorMessage = this.reduceError(error);
        } finally {
            this.isLoading = false;
        }
    }

    handleNext() {
        if (!this.hasMorePages) {
            return;
        }
        const targetPage = this.currentPage + 1;
        if (this.pageStartIndices.length < targetPage) {
            this.pageStartIndices.push(this.nextIndex);
        }
        this.fetchPageByIndex(this.nextIndex, targetPage);
    }

    handlePrevious() {
        if (this.currentPage <= 1) {
            return;
        }
        const targetPage = this.currentPage - 1;
        const startIndex = this.getStartIndexForPage(targetPage);
        this.fetchPageByIndex(startIndex, targetPage);
    }

    handleFirst() {
        if (this.currentPage <= 1) {
            return;
        }
        this.fetchPageByIndex(0, 1);
    }

    handleLast() {
        const lastPage = this.estimatedTotalPages;
        if (this.currentPage >= lastPage) {
            return;
        }
        const startIndex = (lastPage - 1) * PAGE_SIZE;
        this.fetchPageByIndex(startIndex, lastPage);
    }

    /**
     * Returns the start index for a given page number.
     * Uses the tracked index from sequential navigation if available,
     * otherwise falls back to offset-based calculation.
     */
    getStartIndexForPage(page) {
        const tracked = this.pageStartIndices[page - 1];
        if (tracked != null) {
            return tracked;
        }
        return (page - 1) * PAGE_SIZE;
    }

    get hasRecords() {
        return this.records && this.records.length > 0;
    }

    get rowNumberOffset() {
        return (this.currentPage - 1) * PAGE_SIZE;
    }

    get showPagination() {
        return this.estimatedTotalPages > 0;
    }

    get isPrevDisabled() {
        return this.isLoading || this.currentPage <= 1;
    }

    get isNextDisabled() {
        return this.isLoading || this.currentPage >= this.estimatedTotalPages;
    }

    get estimatedTotalPages() {
        if (this.totalRecords === 0) {
            return 0;
        }
        return Math.ceil(this.totalRecords / PAGE_SIZE);
    }

    get pageInfo() {
        return `Page ${this.currentPage} of ~${this.estimatedTotalPages}`;
    }

    get recordCountInfo() {
        return `${this.totalRecords} total records`;
    }

    get recordsReturned() {
        return this.records ? this.records.length : 0;
    }

    get showDeletedRowsBadge() {
        return this.deletedRowsSkipped > 0;
    }

    get deletedRowsInfo() {
        return `${this.deletedRowsSkipped} deleted rows skipped on this page`;
    }

    get trackedPagesInfo() {
        return `${this.pageStartIndices.length} page indices tracked`;
    }

    reduceError(error) {
        if (typeof error === 'string') {
            return error;
        }
        if (error?.body?.message) {
            return error.body.message;
        }
        if (error?.message) {
            return error.message;
        }
        return 'An unknown error occurred.';
    }
}
