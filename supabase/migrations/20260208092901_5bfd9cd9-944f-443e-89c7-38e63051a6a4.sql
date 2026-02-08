-- Update the reorder function to use high temporary values instead of negative
-- This avoids violating the q_no > 0 check constraint
CREATE OR REPLACE FUNCTION public.reorder_rank_mcq_questions(
  question_ids uuid[],
  new_order int[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i int;
  temp_offset int := 1000000; -- Use high temporary values instead of negative
BEGIN
  -- First, set all q_no to high temporary values to avoid unique constraint conflicts
  FOR i IN 1..array_length(question_ids, 1) LOOP
    UPDATE rank_mcq_questions
    SET q_no = temp_offset + i
    WHERE id = question_ids[i];
  END LOOP;
  
  -- Then set the correct final values
  FOR i IN 1..array_length(question_ids, 1) LOOP
    UPDATE rank_mcq_questions
    SET q_no = new_order[i]
    WHERE id = question_ids[i];
  END LOOP;
END;
$$;