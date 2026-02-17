/**
 * @description  Apex controller demonstrating Database.Cursor (standard cursor) for UI pagination.
 *               Standard cursors support up to 50M rows and allow random-access offset navigation.
 *               The cursor is a snapshot -- totalRecords and totalPages are immutable once created.
 *               initCursor() returns full metadata; getPage() returns only what changes per page.
 * @apiVersion   66.0
 */
public with sharing class TFB_StandardCursorController {

    private static final Integer DEFAULT_PAGE_SIZE = 10;

    public class CursorResult {
        @AuraEnabled public Database.Cursor cursor { get; set; }
        @AuraEnabled public List<Account> records { get; set; }
        @AuraEnabled public Integer totalRecords { get; set; }
        @AuraEnabled public Integer totalPages { get; set; }
        @AuraEnabled public Integer currentPage { get; set; }
    }

    /**
     * @description  Creates cursor, returns first page + immutable metadata (totalRecords, totalPages).
     *               The client stores these once and reuses them -- they never change for a given cursor.
     */
    @AuraEnabled
    public static CursorResult initCursor() {
        try {
            Database.Cursor cursor = Database.getCursor(
                'SELECT Id, Name, Industry, Phone, CreatedDate FROM Account ORDER BY Name'
            );
            Integer totalRecords = cursor.getNumRecords();

            CursorResult result = new CursorResult();
            result.cursor = cursor;
            result.totalRecords = totalRecords;
            result.totalPages = (Integer) Math.ceil((Decimal) totalRecords / DEFAULT_PAGE_SIZE);
            result.records = totalRecords > 0 ? cursor.fetch(0, Math.min(DEFAULT_PAGE_SIZE, totalRecords)) : new List<Account>();
            result.currentPage = 1;
            return result;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    /**
     * @description  Fetches a specific page. Only returns cursor + records + currentPage.
     *               totalRecords/totalPages are not recomputed -- the client retains them from init.
     *               Single safeguard: clamp fetch count for the last page where remaining < pageSize.
     */
    @AuraEnabled
    public static CursorResult getPage(Database.Cursor cursor, Integer page, Integer pageSize) {
        try {
            Integer offset = (page - 1) * pageSize;
            Integer fetchCount = Math.min(pageSize, cursor.getNumRecords() - offset);

            CursorResult result = new CursorResult();
            result.cursor = cursor;
            result.records = fetchCount > 0 ? cursor.fetch(offset, fetchCount) : new List<Account>();
            result.currentPage = page;
            return result;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}
