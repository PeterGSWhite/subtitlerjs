import time, sys
from flask import Flask, jsonify, request

from flask_cors import CORS

app = Flask(__name__)
CORS(app)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
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
    print(request, file=sys.stderr)
    subtitle = request.get_json()['subtitle']
    print('sub', subtitle, file=sys.stderr)

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
    pass

@app.route('/api/subtitles', methods = ['DELETE'])
def delete_subtitle():
    pass

if __name__ == "__main__":
    app.run()