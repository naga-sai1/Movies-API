const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname,"moviesData.db");
let db = null;

const initializeDBAndServer = async () =>{
    try{
        db = await open({
            filename:dbPath,
            driver:sqlite3.Database,
        });
        app.listen(3002,()=>{
            console.log("Server is running at http://localhost:3002");
        });
    }catch(e){
        console.log(`DB Error:${e.message}`);
        process.exit(1);
    }
}

initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorID: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

const directorsTableConvertToResponseObject = (dbObject) => {
    return {
        directorId: dbObject.director_id,
        directorName: dbObject.director_name,
    };
};

app.get("/movies/",async(request,response)=>{
    const movieNameArray = `
        SELECT movie_name FROM movie ORDER BY movie_id;
    `;
    const movieName = await db.all(movieNameArray);
    response.send(movieName.map((everyMovie)=>convertDbObjectToResponseObject(everyMovie)
    )
    );
});

app.get("/movies/:movieId/",async(request,response)=>{
    const { movieId } = request.params;
    const getMovieQuery = `
        SELECT * FROM movie WHERE movie_id = ${movieId};
    `;
    const movieDetails = await db.get(getMovieQuery);
    response.send(convertDbObjectToResponseObject(movieDetails));
});

app.post("/movies/",async(request,response)=>{
    const {directorId,movieName,leadActor} = request.body;
    const addMovieQuery = `
        INSERT INTO 
            movie(director_id,movie_name,lead_actor)
        VALUES (${directorId},'${movieName}','${leadActor}');
    `;
    const dbResponse = await db.run(addMovieQuery);
    response.send("Movie Successfully Added")    
});

app.put("/movies/:movieId/", async(request,response)=>{
    const { movieId } = request.params;
    const {directorId,movieName,leadActor} = request.body; 
    const updateQuery = `
        UPDATE 
            movie 
        SET 
            director_id = ${directorId},
            movie_name = '${movieName}',
            lead_actor = '${leadActor}'
        WHERE 
            movie_id = ${movieId};
    `;
    await db.run(updateQuery);
    response.send("Movie Details Updated");
});

app.delete("/movies/:movieId/",async(request,response)=>{
    const {movieId} = request.params;
    const deleteMovieQuery = `
        DELETE FROM 
            movie         
        WHERE 
            movie_id = ${movieId};
    `;
    await db.run(deleteMovieQuery);
    response.send("Movie Removed");
});

app.get("/directors/",async(request,response)=>{
    const getDirectorsQuery = `
        SELECT * FROM director
    `;
    const directorsArray = await db.all(getDirectorsQuery);
    response.send(directorsArray.map((eachDirector)=>directorsTableConvertToResponseObject(eachDirector)
    )
    );
});

app.get("/directors/:directorId/movies/",async(request,response)=>{
    const { directorId} = request.params;
    const getDirectorMoviesQuery = `
        SELECT movie_name FROM movie WHERE director_id = ${directorId};
    `;
    const moviesArray = await db.all(getDirectorMoviesQuery);
    response.send(moviesArray.map((everyMovie)=>convertDbObjectToResponseObject(everyMovie)
    )
    );
});

module.exports = app;