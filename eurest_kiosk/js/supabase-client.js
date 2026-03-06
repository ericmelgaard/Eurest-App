const SUPABASE_URL = 'https://wmrqgyvnauqwkvdvjaxn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtcnFneXZuYXVxd2t2ZHZqYXhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTQyNzksImV4cCI6MjA4NzczMDI3OX0.S4jbhUPd3Jj77wYLRIsG7mvDJyPHpse8T4Z-XHvWtpQ';

class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
    this.headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    };
  }

  async fetch(endpoint, options = {}) {
    const url = `${this.url}/rest/v1/${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase error: ${error}`);
    }

    return response.json();
  }

  from(table) {
    return new QueryBuilder(this, table);
  }
}

class QueryBuilder {
  constructor(client, table) {
    this.client = client;
    this.table = table;
    this.queryParams = [];
    this.selectFields = '*';
    this._promise = null;
  }

  select(fields = '*') {
    this.selectFields = fields;
    return this;
  }

  eq(column, value) {
    this.queryParams.push(`${column}=eq.${value}`);
    return this;
  }

  order(column, options = {}) {
    const direction = options.ascending === false ? 'desc' : 'asc';
    this.queryParams.push(`order=${column}.${direction}`);
    return this;
  }

  _execute() {
    if (!this._promise) {
      this._promise = (async () => {
        let endpoint = `${this.table}?select=${this.selectFields}`;

        if (this.queryParams.length > 0) {
          endpoint += '&' + this.queryParams.join('&');
        }

        try {
          const data = await this.client.fetch(endpoint);
          return { data, error: null };
        } catch (error) {
          return { data: null, error };
        }
      })();
    }
    return this._promise;
  }

  then(onFulfilled, onRejected) {
    return this._execute().then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this._execute().catch(onRejected);
  }

  finally(onFinally) {
    return this._execute().finally(onFinally);
  }
}

const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
