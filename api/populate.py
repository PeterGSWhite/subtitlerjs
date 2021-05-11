import time
from flask import Flask
from speechlib import find_speech_regions, extract_audio
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

app = Flask(__name__)

@app.route('/get_regions/<source_path>', methods = ['GET', 'POST'])
def get_regions(source_path):
    source_path = r"C:\Users\Peter\proj\subtitler\subtitlerr\public\video/" + source_path
    print(source_path)
    audio_filename, audio_rate = extract_audio(source_path)
    regions = find_speech_regions(audio_filename)

    database = r"C:\Users\Peter\proj\subtitler\subtitlerr\api\devsubs.db"
    conn = create_connection(database)
    with conn:
        region = regions[0]
        print(region)
        sql = ''' INSERT INTO subtitles(id,start,end,text,next_start)
            VALUES(?,?,?,?,?) '''
        cur = conn.cursor()
        cur.execute(sql, (str(region['id']), region['start'], region['end'], region['text'], region['next_start']))
        conn.commit()
    for region in regions[1:-1]:
        with conn:
            sql = ''' INSERT INTO subtitles(id,start,end,text,prev_end,next_start)
                VALUES(?,?,?,?,?,?) '''
            cur = conn.cursor()
            cur.execute(sql, (str(region['id']), region['start'], region['end'], region['text'], region['prev_end'], region['next_start']))
            conn.commit()
    with conn:
        region = regions[-1]
        sql = ''' INSERT INTO subtitles(id,start,end,text,prev_end)
            VALUES(?,?,?,?,?) '''
        cur = conn.cursor()
        cur.execute(sql, (str(region['id']), region['start'], region['end'], region['text'], region['prev_end']))
        conn.commit()
    

    return {'regions': regions}

if __name__ == "__main__":
    app.run()