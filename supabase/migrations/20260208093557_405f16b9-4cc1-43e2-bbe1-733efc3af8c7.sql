-- Allow temporary q_no=0 during reorder operations (buffer value)
-- Keep max question limit at 50
ALTER TABLE public.rank_mcq_questions
DROP CONSTRAINT IF EXISTS rank_mcq_questions_q_no_check;

ALTER TABLE public.rank_mcq_questions
ADD CONSTRAINT rank_mcq_questions_q_no_check
CHECK (q_no >= 0 AND q_no <= 50);

-- Reorder function using 0 as an in-range temporary buffer
-- Avoids violating the (q_no <= 50) check constraint and UNIQUE(rank_paper_id, q_no)
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
  _paper_id uuid;
BEGIN
  IF array_length(question_ids, 1) IS NULL OR array_length(question_ids, 1) = 0 THEN
    RETURN;
  END IF;

  -- infer paper id from the first question
  SELECT rank_paper_id INTO _paper_id
  FROM public.rank_mcq_questions
  WHERE id = question_ids[1];

  IF _paper_id IS NULL THEN
    RAISE EXCEPTION 'Invalid question_ids: paper not found';
  END IF;

  -- Move-by-position using 0 as a buffer slot
  FOR i IN 1..array_length(question_ids, 1) LOOP
    -- Free up the target slot by moving whoever is currently at that q_no to 0
    UPDATE public.rank_mcq_questions
    SET q_no = 0
    WHERE rank_paper_id = _paper_id
      AND q_no = new_order[i];

    -- Place the desired question into the target slot
    UPDATE public.rank_mcq_questions
    SET q_no = new_order[i]
    WHERE id = question_ids[i];
  END LOOP;

  -- Safety: ensure no questions remain at q_no=0 for this paper
  IF EXISTS (
    SELECT 1 FROM public.rank_mcq_questions
    WHERE rank_paper_id = _paper_id AND q_no = 0
  ) THEN
    RAISE EXCEPTION 'Reorder failed: leftover buffer values';
  END IF;
END;
$$;