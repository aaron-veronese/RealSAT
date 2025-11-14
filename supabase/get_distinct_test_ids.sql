-- Create a function to get distinct test IDs
CREATE OR REPLACE FUNCTION get_distinct_test_ids()
RETURNS TABLE (test_id integer) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT q.test_id
  FROM questions q
  ORDER BY q.test_id ASC;
END;
$$ LANGUAGE plpgsql;
