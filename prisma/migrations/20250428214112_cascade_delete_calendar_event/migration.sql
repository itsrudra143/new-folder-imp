-- DropForeignKey
ALTER TABLE "calendar_events" DROP CONSTRAINT "calendar_events_testId_fkey";

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
