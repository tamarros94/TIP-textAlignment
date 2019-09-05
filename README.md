# TIP-textAlignment

Topics in Image Processing – Manual Alignment
By Amir Golan and Tamar Rosen.

### General Description

Given a basic Angular project which presented a manuscript viewer, our goal was to add a feature of 'Manual Alignment' between 2 manuscripts using MongoDB servers to save the users' results.
The meaning of this feature is to allow the following:
(1) presenting 2 different manuscripts side by side and (2) selecting a word from the first manuscript and matching it to another word from the second manuscript (this is intended to be done manually by the user, by selecting both areas using a polygon marker tool, which exists in the image viewer component).
In addition to adding the feature of the manual alignment tool, we were also asked to save the user's marked matches (the manual alignment details) in some data base (using MongoDB), for a later use.


### Implementation details

We saved the user's results (the alignment) as a json file that gathered the user's markings. The json file contains of all pairs of corresponding words marked by the user. Practically, a pair (p1,p2) consists of the coordinates of polygon p1 (corresponds to the first word marked by the user), and the coordinates of polygon p2 (corresponds to the second word). Also, in order to arrange the data more informatively, some meta-data added. The meta-data describes where exactly (manuscript id, page number) the marked polygons resides. 

Putting it all together, eventually we got the following json file (describing the user's alignment) struct: 
```
[{
manuscript1_id: _ , 
manuscript2_id: _ , 
page1: _ , 
page2: _ ,
match: [ { <polygon1_vertices>, <polygon2_vertices }, … ,  { <polygon1_vertices>, <polygon2_vertices } ] 
}]
```

The struct that we get is an array, consisting e_1, … ,e_n elements.
Each element is a struct containing:

-	Both manuscripts id's.
-	Page number in both manuscripts.
-	An array of all the matching polygons (describing some words) in those pages.


### Code Implementation

The additions for the basic manuscript-viewer were made mainly in the imageService and in the sideanv-open-close and main app components.
We made use of the imageService by adding fields to identify the current manuscripts opened by user. Everytime a user selects a manuscript to view, the program reaches the following method inside the sideanv-open-close component:
```
public onValChange(val: number) {
  console.log('change to manuscript ' + val );
  this._currentWorkingManuscript = val ;
  this._manuscriptService.cacheCurrentPage(
    this.profileManuscripts[ this._currentWorkingManuscript].pages[0],
    this._currentWorkingManuscript, this.name);
}
```
this method calls the method ‘cacheCurrentPage’ implemented inside the imageService, which then saves the current manuscript identifications (id and its ImagePage instance)

We added a button to the main component:
```
<button (click)="addManualAlign()">Add Manual Align</button>
```

When the user pressed this button, the program reaches the following method implemented in the main component:
```
public addManualAlign() {
  this._manuscriptService.saveMatches().toPromise().then(x => alert('saved'));
}
```





This method calls the following method implemented in the imageService:
```
public saveMatches() {
  // @ts-ignore
  const rightImagePage: ImagePage = this._currentMenuScripts['right']['imagePage'];
  // @ts-ignore
  const leftImagePage: ImagePage = this._currentMenuScripts['left']['imagePage'];

  const matches = {
    rightMenuScriptId: this._currentMenuScripts['right']['menuScriptId'],
    leftMenuScriptId: this._currentMenuScripts['left']['menuScriptId'],
    rightPage: {
      number: rightImagePage.pageNumber,
      polygons: rightImagePage.version[rightImagePage.version.length - 1].polygonLayer
        .slice(this.getStartPolygon(rightImagePage, leftImagePage))
    },
    leftPage: {
      number: leftImagePage.pageNumber,
      polygons: leftImagePage.version[leftImagePage.version.length - 1].polygonLayer
        .slice(this.getStartPolygon(rightImagePage, leftImagePage))
    }
  };
  console.log(JSON.stringify(matches));
  return this._http.post('localhost:3000/matches', matches);
}
``` 
This method can be considered as the most important part of our program.
We extract the ImagePage of the left and right manuscript, containing the polygon coordinates (nested information).
Then, we create JSON that describes the matches defined by the user:
```
{
    rightMenuScriptId: ___ ,
    leftMenuScriptId: ___,
    rightPage: {
      number: ___,
      polygons:Polygon[],
    },
    leftPage: {
      number: ___,
      polygons: Polygon[],
    }
  }
```
Then, we post this JSON to the mongo server (and print it to console for debugging purposes)


### Conclusions: 

We have learned a lot throughout the process. Reading and understanding how to use Angular and MongoDB was not easy, but contributing. It certainly was a different and refreshing experience from what we used to have during our studies - diving into an existing code, understanding the different components and how to fit in.
