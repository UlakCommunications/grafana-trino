import React from 'react';
import { QueryEditorProps } from '@grafana/data';
import { base32Regex, DataSource, quickwitRegex } from './datasource';
import { TrinoDataSourceOptions, TrinoQuery, defaultQuery, SelectableFormatOptions } from './types';
import { FormatSelect, QueryCodeEditor } from '@grafana/aws-sdk';
import { decode } from 'hi-base32';

type Props = QueryEditorProps<DataSource, TrinoQuery, TrinoDataSourceOptions>;

function decodeQuickwitQuery(query?: string): string | undefined {
  return query?.replace(quickwitRegex, (match, encoded) => {
    if (encoded.length % 8 === 0 && base32Regex.exec(encoded)) {
      const decodedContent = decode(encoded);
      return match.replace(encoded, decodedContent);
    }
    return match;
  });
}

export function QueryEditor(props: Props) {
  const queryWithDefaults = {
    ...defaultQuery,
    ...props.query,
  };

  queryWithDefaults.rawSQL = decodeQuickwitQuery(queryWithDefaults.rawSQL);

  return (
    <>
        <div className="gf-form-group">
          <h6>Frames</h6>
          <FormatSelect
            query={props.query}
            options={SelectableFormatOptions}
            onChange={props.onChange}
            onRunQuery={props.onRunQuery}
          />
        </div>
        <div style={{ minWidth: '400px', marginLeft: '10px', flex: 1 }}>
          <QueryCodeEditor
            language="sql"
            query={queryWithDefaults}
            onChange={props.onChange}
            onRunQuery={props.onRunQuery}
            getSuggestions={() => []}
          />
        </div>
    </>
  );
}
