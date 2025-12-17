#!/bin/bash

echo "Executing customer batches (lines 3-101)..."
for i in {3..101}; do
  QUERY=$(sed -n "${i}p" scripts/all-batches.sql)
  if [[ $QUERY == INSERT* ]]; then
    echo "Executing customer batch $((i-2))..."
    # Note: This would need to call the Supabase execute_sql endpoint
    # For now, we'll just output the line number
    echo "Line $i ready"
  fi
done

echo ""
echo "Executing product batches (lines 104-203)..."
for i in {104..203}; do
  QUERY=$(sed -n "${i}p" scripts/all-batches.sql)
  if [[ $QUERY == INSERT* ]]; then
    echo "Executing product batch $((i-103))..."
    echo "Line $i ready"
  fi
done
