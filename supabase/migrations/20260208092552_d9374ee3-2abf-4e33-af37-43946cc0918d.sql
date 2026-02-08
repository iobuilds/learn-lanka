-- Create a function to reorder questions atomically
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
BEGIN
  -- First, set all q_no to negative values to avoid constraint conflicts
  FOR i IN 1..array_length(question_ids, 1) LOOP
    UPDATE rank_mcq_questions
    SET q_no = -i
    WHERE id = question_ids[i];
  END LOOP;
  
  -- Then set the correct positive values
  FOR i IN 1..array_length(question_ids, 1) LOOP
    UPDATE rank_mcq_questions
    SET q_no = new_order[i]
    WHERE id = question_ids[i];
  END LOOP;
END;
$$;