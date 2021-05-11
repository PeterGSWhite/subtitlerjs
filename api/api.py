import time, sys
from flask import Flask, jsonify, request, make_response

from flask_cors import CORS

app = Flask(__name__)
CORS(app)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
app.config['CORS_HEADERS'] = 'Access-Control-Allow-Origin'
import sqlite3
from sqlite3 import Error

def create_connection(db_file):
    """ create a database connection to the SQLite database
        specified by db_file
    :param db_file: database file
    :return: Connection object or None
    """
    conn = None
    try:
        conn = sqlite3.connect(db_file)
    except Error as e:
        print(e)

    return conn

database = r"C:\Users\Peter\proj\subtitler\subtitlerr\api\devsubs.db"

@app.route('/api/subtitles', methods = ['GET'])
def get_subtitles():
    conn = create_connection(database)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT * FROM subtitles")

    rows = cur.fetchall()
    return jsonify({'subtitles': [dict(row) for row in rows]})

@app.route('/api/subtitles', methods = ['POST'])
def create_subtitle():
    subtitle = request.get_json()['subtitle']

    conn = create_connection(database)
    cur = conn.cursor()
    sql = ''' INSERT INTO subtitles(id, start, end, prev_end, next_start, text)
              VALUES(?,?,?,?,?,?) '''
    cur.execute(sql, (subtitle['id'], subtitle['start'], subtitle['end'], subtitle['prev_end'], subtitle['next_start'], subtitle['text']))
    conn.commit()
    print('pooo wololo', file=sys.stderr)
    return subtitle

@app.route('/api/subtitles', methods = ['PATCH'])
def update_subtitle():
    subtitle = request.get_json()['subtitle']
    print('udpated sub', subtitle, file=sys.stderr)
    conn = create_connection(database)
    cur = conn.cursor()

    sql = ''' UPDATE subtitles
              SET start = ? ,
                  end = ? ,
                  prev_end = ?,
                  next_start = ?,
                  text = ?
              WHERE id = ?'''
    cur = conn.cursor()
    cur.execute(sql, (subtitle['start'], subtitle['end'], subtitle['prev_end'], subtitle['next_start'], subtitle['text'], subtitle['id']))
    conn.commit()
    return subtitle

@app.route('/api/subtitles/', methods = ['DELETE'])
def delete_subtitle():
    print('j', request.get_json())
    print('da', request.data)
    id = request.get_json()['id']
    conn = create_connection(database)
    cur = conn.cursor()

    sql = ''' DELETE FROM subtitles
              WHERE id = ?'''
    cur = conn.cursor()
    cur.execute(sql, (id,))
    conn.commit()
    response = make_response(jsonify({}), 204)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

if __name__ == "__main__":
    app.run()