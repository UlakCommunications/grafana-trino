import { DataSourceInstanceSettings, ScopedVars } from '@grafana/data';
import { DataSourceWithBackend, getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import { TrinoDataSourceOptions, TrinoQuery } from './types';
import { TrinoDataVariableSupport } from './variable';
import { lastValueFrom, of } from 'rxjs';
import { catchError, mapTo } from 'rxjs/operators';
import { encode } from 'hi-base32';
import { map } from 'lodash';
import nunjucks from 'nunjucks';

export const quickwitRegex = /from\s+(?:\w+\.)+?"([\s\S]*?)"\s+as/g;
export const base32Regex = /^[A-Z2-7]+=*$/;

function encodeQuickwitQuery(rawSQL: string): string {
  return rawSQL.replace(quickwitRegex, (match, plain) => {
    if (plain.length % 8 === 0 && base32Regex.exec(plain)) {
      return match;
    }
    const encodedContent = encode(plain.replaceAll("\"\"", "\""));
    return match.replace(plain, encodedContent);
  });
}

export class DataSource extends DataSourceWithBackend<TrinoQuery, TrinoDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<TrinoDataSourceOptions>) {
    super(instanceSettings);
    this.variables = new TrinoDataVariableSupport();
    this.annotations={};
    // give interpolateQueryStr access to this
    this.interpolateQueryStr = this.interpolateQueryStr.bind(this);
  }

  testDatasource(): Promise<any> {
    return lastValueFrom(
      getBackendSrv()
        .fetch({
          url: '/api/ds/query',
          method: 'POST',
          requestId: 'A',
          data: {
            from: '5m',
            to: 'now',
            queries: [
              {
                refId: 'A',
                key: 'A',
                intervalMs: 1,
                maxDataPoints: 1,
                datasource: this.getRef(),
                rawSQL: 'SELECT 1',
                format: 0,
              },
            ],
          },
        })
        .pipe(
          mapTo({ status: 'success', message: 'Database Connection OK' }),
          catchError((err) => {
            return of({
              status: 'error',
              message: err.error ? err.error : (err.statusText ? ("Query error: " + err.statusText) : "Error connecting to Trino"),
            });
          })
        )
    );
  }

  applyTemplateVariables(query: TrinoQuery, scopedVars: ScopedVars) {
    return {
      ...query,
      rawSQL: getTemplateSrv().replace(encodeQuickwitQuery(nunjucks.renderString(query.rawSQL, {})), scopedVars, this.interpolateQueryStr),
    };
  }

  interpolateQueryStr(value: any, variable: { multi: any; includeAll: any }, defaultFormatFn: any) {
    // if no multi or include all do not regexEscape
    if (!variable.multi && !variable.includeAll) {
      return this.escapeLiteral(value);
    }

    if (typeof value === 'string') {
      return this.quoteLiteral(value);
    }

    const escapedValues = map(value, this.quoteLiteral);
    return escapedValues.join(',');
  }

  quoteIdentifier(value: any) {
    return '"' + String(value).replace(/"/g, '""') + '"';
  }

  quoteLiteral(value: any) {
    return "'" + String(value).replace(/'/g, "''") + "'";
  }

  escapeLiteral(value: any) {
    return String(value).replace(/'/g, "''");
  }
}
